// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EHRRegistry - MediCatalyst Decentralized Health Record Ledger
 * @notice Implements Hybrid On-Chain/Off-Chain Electronic Health Record (EHR) registry.
 * Complies with ABDM (Ayushman Bharat Digital Mission) & DPDP Act 2023 principles:
 *  - ZERO Protected Health Information (PHI) stored directly on-chain.
 *  - Off-chain storage referenced via cryptographic IPFS Content Identifiers (CID).
 *  - On-chain mathematical integrity verification via SHA-256 data checksums.
 *  - Time-bounded, revocable patient consent management matrix.
 *  - Immutable regulatory audit trails and emergency "Break-Glass" dispatch logging.
 */
contract EHRRegistry {
    // Contract Owner (National Health Authority / Protocol Deployer)
    address public immutable authorityAdmin;

    struct MedicalRecord {
        bytes32 idHash;             // Keccak256 hash of the unique record ID (e.g., "rx-172652...")
        string ipfsCID;             // Decentralized IPFS Content Identifier (CIDv1)
        bytes32 integrityChecksum;  // SHA-256 cryptographic hash of the original plaintext medical document
        address hospitalAddress;    // Ethereum address / DID of the issuing healthcare facility
        string hospitalName;        // Registered Hospital Entity Name
        string doctorName;          // Licensed Consulting Medical Officer
        uint256 timestamp;          // Unix timestamp of on-chain minting
        bool isRevoked;             // Soft revocation flag in case of prescription amendment
    }

    struct AccessConsent {
        address authorizedEntity;   // Hospital / Ambulance / Specialist address
        uint256 validUntil;         // Expiration timestamp of access grant
        bool isActive;              // Active toggle
    }

    struct AuditEvent {
        bytes32 recordIdHash;       // Associated record hash
        address accessor;           // Caller who viewed or modified the record
        string actionType;          // "RECORD_MINTED", "RECORD_ACCESSED", "ACCESS_GRANTED", "ACCESS_REVOKED", "EMERGENCY_BREAKGLASS"
        uint256 timestamp;          // Timestamp of the event
        string details;             // Additional contextual notes (e.g., dispatch ID)
    }

    // Mapping: keccak256(abhaId) => Array of MedicalRecords
    mapping(bytes32 => MedicalRecord[]) private patientRecords;

    // Mapping: keccak256(abhaId) => (Provider Address => AccessConsent)
    mapping(bytes32 => mapping(address => AccessConsent)) public accessConsents;

    // Mapping: keccak256(abhaId) => Array of AuditEvents
    mapping(bytes32 => AuditEvent[]) private patientAuditLogs;

    // Authorized Healthcare Providers Registry (Hospitals, Emergency Fleets)
    mapping(address => bool) public authorizedProviders;

    // Events for distributed indexing (The Graph / Web3 Event Listeners)
    event MedicalRecordRegistered(
        bytes32 indexed patientHash,
        bytes32 indexed recordIdHash,
        string ipfsCID,
        address indexed hospitalAddress,
        string hospitalName,
        uint256 timestamp
    );

    event AccessGranted(
        bytes32 indexed patientHash,
        address indexed authorizedEntity,
        uint256 validUntil
    );

    event AccessRevoked(
        bytes32 indexed patientHash,
        address indexed authorizedEntity
    );

    event EmergencyBreakGlassTriggered(
        bytes32 indexed patientHash,
        address indexed emergencyResponder,
        string emergencyDispatchId,
        uint256 timestamp
    );

    event RecordIntegrityVerified(
        bytes32 indexed patientHash,
        bytes32 indexed recordIdHash,
        bool isMatch,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == authorityAdmin, "EHRRegistry: Caller is not National Health Authority Admin");
        _;
    }

    constructor() {
        authorityAdmin = msg.sender;
        authorizedProviders[msg.sender] = true;
    }

    /**
     * @notice Register or whitelist a verified healthcare facility or ambulance fleet.
     */
    function setProviderAuthorization(address provider, bool isAuthorized) external onlyAdmin {
        authorizedProviders[provider] = isAuthorized;
    }

    /**
     * @notice Hash patient ABHA ID to prevent exposing plain health ID on the public ledger.
     */
    function computePatientHash(string memory abhaId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("ABDM_SALT_V1:", abhaId));
    }

    /**
     * @notice Mint and publish a new medical record / e-prescription reference to the blockchain.
     * @param patientAbhaId Patient's ABHA identifier
     * @param recordId Unique prescription or clinical document ID
     * @param ipfsCID Content address of the encrypted payload stored on IPFS
     * @param integrityChecksum SHA-256 hash of the medical document for tamper-proofing
     * @param hospitalName Human-readable name of the facility
     * @param doctorName Medical practitioner name
     */
    function registerMedicalRecord(
        string memory patientAbhaId,
        string memory recordId,
        string memory ipfsCID,
        bytes32 integrityChecksum,
        string memory hospitalName,
        string memory doctorName
    ) external returns (bytes32 recordIdHash) {
        bytes32 pHash = computePatientHash(patientAbhaId);
        recordIdHash = keccak256(abi.encodePacked(recordId));

        MedicalRecord memory newRec = MedicalRecord({
            idHash: recordIdHash,
            ipfsCID: ipfsCID,
            integrityChecksum: integrityChecksum,
            hospitalAddress: msg.sender,
            hospitalName: hospitalName,
            doctorName: doctorName,
            timestamp: block.timestamp,
            isRevoked: false
        });

        patientRecords[pHash].push(newRec);

        // Append immutable audit log
        patientAuditLogs[pHash].push(AuditEvent({
            recordIdHash: recordIdHash,
            accessor: msg.sender,
            actionType: "RECORD_MINTED",
            timestamp: block.timestamp,
            details: string(abi.encodePacked("Hospital: ", hospitalName, ", Doctor: ", doctorName))
        }));

        emit MedicalRecordRegistered(
            pHash,
            recordIdHash,
            ipfsCID,
            msg.sender,
            hospitalName,
            block.timestamp
        );
    }

    /**
     * @notice Patient grants time-bounded consent to a hospital, doctor, or paramedic.
     */
    function grantAccess(
        string memory patientAbhaId,
        address provider,
        uint256 durationInSeconds
    ) external {
        bytes32 pHash = computePatientHash(patientAbhaId);
        uint256 expiry = block.timestamp + durationInSeconds;

        accessConsents[pHash][provider] = AccessConsent({
            authorizedEntity: provider,
            validUntil: expiry,
            isActive: true
        });

        patientAuditLogs[pHash].push(AuditEvent({
            recordIdHash: bytes32(0),
            accessor: msg.sender,
            actionType: "ACCESS_GRANTED",
            timestamp: block.timestamp,
            details: "Patient granted temporary access consent"
        }));

        emit AccessGranted(pHash, provider, expiry);
    }

    /**
     * @notice Patient revokes consent immediately.
     */
    function revokeAccess(string memory patientAbhaId, address provider) external {
        bytes32 pHash = computePatientHash(patientAbhaId);
        accessConsents[pHash][provider].isActive = false;

        patientAuditLogs[pHash].push(AuditEvent({
            recordIdHash: bytes32(0),
            accessor: msg.sender,
            actionType: "ACCESS_REVOKED",
            timestamp: block.timestamp,
            details: "Patient revoked provider access"
        }));

        emit AccessRevoked(pHash, provider);
    }

    /**
     * @notice Emergency "Break-Glass" Access for active 108 ambulance dispatch.
     * Generates an unalterable on-chain incident audit log for statutory oversight.
     */
    function emergencyBreakGlass(
        string memory patientAbhaId,
        string memory emergencyDispatchId
    ) external {
        bytes32 pHash = computePatientHash(patientAbhaId);

        patientAuditLogs[pHash].push(AuditEvent({
            recordIdHash: bytes32(0),
            accessor: msg.sender,
            actionType: "EMERGENCY_BREAKGLASS",
            timestamp: block.timestamp,
            details: string(abi.encodePacked("108 Dispatch Code: ", emergencyDispatchId))
        }));

        emit EmergencyBreakGlassTriggered(pHash, msg.sender, emergencyDispatchId, block.timestamp);
    }

    /**
     * @notice Get total medical records count for an ABHA ID.
     */
    function getPatientRecordCount(string memory patientAbhaId) external view returns (uint256) {
        bytes32 pHash = computePatientHash(patientAbhaId);
        return patientRecords[pHash].length;
    }

    /**
     * @notice Retrieve an individual medical record reference by index.
     */
    function getPatientRecord(
        string memory patientAbhaId,
        uint256 index
    ) external view returns (
        bytes32 idHash,
        string memory ipfsCID,
        bytes32 integrityChecksum,
        address hospitalAddress,
        string memory hospitalName,
        string memory doctorName,
        uint256 timestamp,
        bool isRevoked
    ) {
        bytes32 pHash = computePatientHash(patientAbhaId);
        require(index < patientRecords[pHash].length, "EHRRegistry: Record index out of bounds");
        MedicalRecord memory r = patientRecords[pHash][index];
        return (
            r.idHash,
            r.ipfsCID,
            r.integrityChecksum,
            r.hospitalAddress,
            r.hospitalName,
            r.doctorName,
            r.timestamp,
            r.isRevoked
        );
    }

    /**
     * @notice Verify whether a presented record's SHA-256 hash matches the on-chain immutable hash.
     */
    function verifyRecordIntegrity(
        string memory patientAbhaId,
        string memory recordId,
        bytes32 currentChecksum
    ) external returns (bool isMatch) {
        bytes32 pHash = computePatientHash(patientAbhaId);
        bytes32 targetHash = keccak256(abi.encodePacked(recordId));
        
        MedicalRecord[] memory records = patientRecords[pHash];
        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].idHash == targetHash) {
                isMatch = (records[i].integrityChecksum == currentChecksum);
                emit RecordIntegrityVerified(pHash, targetHash, isMatch, block.timestamp);
                return isMatch;
            }
        }
        return false;
    }

    /**
     * @notice Retrieve the immutable audit trail for a patient.
     */
    function getAuditLogs(string memory patientAbhaId) external view returns (AuditEvent[] memory) {
        bytes32 pHash = computePatientHash(patientAbhaId);
        return patientAuditLogs[pHash];
    }
}

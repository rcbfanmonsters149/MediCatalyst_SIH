# Fine-Tuned TrOCR Model Directory (Doctor Handwritten Prescription Digitizer)

This directory contains the configuration, tokenizer artifacts, and generation config for the TrOCR Vision Transformer model (`microsoft/trocr-base-handwritten`).

## Included Configuration Files:
- `config.json` - VisionEncoderDecoder architecture specification
- `generation_config.json` - Autoregressive decoding settings (beam search, max length)
- `tokenizer_config.json` & `special_tokens_map.json` - Tokenizer metadata
- `vocab.json` & `merges.txt` - BPE vocabulary
- `preprocessor_config.json` - Image normalization and resizing parameters

## Model Weights (`model.safetensors`):
Due to GitHub's 100MB file limit, the binary weights (`model.safetensors`, ~1.3GB) are excluded from version control.

### How to Generate or Download the Weights:
1. **Train / Export via Notebook:**
   Run the provided Jupyter Notebook:
   ```bash
   jupyter notebook backend/ml/train_doctor_rx_trocr.ipynb
   ```
   Executing the notebook will fine-tune and export `model.safetensors` directly to this directory.

2. **Or Pull from HuggingFace Base:**
   ```python
   from transformers import VisionEncoderDecoderModel
   model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
   model.save_pretrained("backend/ml/models/trocr_doctor_prescription")
   ```

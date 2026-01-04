# Fine-tuning NLLB-200 Model with LoRA

This guide explains how to fine-tune the `facebook/nllb-200-distilled-600M` model using LoRA (Low-Rank Adaptation) with your English-Tunisian dataset.

## Overview

The fine-tuning script (`finetune_nllb_lora.py`) will:
- Load your English-Tunisian dataset from CSV
- Reverse it to create Tunisian→English pairs (matching your translator's direction)
- Apply LoRA adapters to the NLLB-200 model for efficient fine-tuning
- Train on your custom dataset
- Save the fine-tuned adapters

## Prerequisites

### 1. Install Required Dependencies

Install the fine-tuning dependencies:

```bash
pip install -r requirements_finetune.txt
```

Or install individually:

```bash
pip install torch transformers peft datasets pandas accelerate sentencepiece protobuf
```

### 2. Verify Dataset

Make sure your dataset exists at:
```
Tunisian_Dataset/english_tunisian_dataset.csv
```

The CSV should have two columns: `English` and `Tunisian`

## Fine-Tuning

### Run the Fine-Tuning Script

```bash
python finetune_nllb_lora.py
```

### Configuration Options

You can modify these settings in `finetune_nllb_lora.py`:

#### Model Configuration
- `MODEL_NAME`: Base model (default: "facebook/nllb-200-distilled-600M")
- `OUTPUT_DIR`: Where to save fine-tuned model (default: "nllb-lora-tunisian-en")

#### LoRA Configuration
- `LORA_R`: Rank of LoRA matrices (default: 16) - higher = more parameters
- `LORA_ALPHA`: LoRA scaling parameter (default: 32)
- `LORA_DROPOUT`: Dropout rate (default: 0.1)

#### Training Configuration
- `BATCH_SIZE`: Training batch size (default: 4)
- `GRADIENT_ACCUMULATION_STEPS`: Effective batch size = BATCH_SIZE × this (default: 4)
- `LEARNING_RATE`: Learning rate (default: 5e-5)
- `NUM_EPOCHS`: Number of training epochs (default: 3)
- `MAX_LENGTH`: Maximum sequence length (default: 512)
- `TRAIN_SPLIT`: Train/validation split (default: 0.9 = 90% train, 10% val)

### Training Process

The script will:
1. Load and preprocess your dataset
2. Reverse the direction (Tunisian→English)
3. Split into train/validation sets
4. Load the base NLLB-200 model
5. Apply LoRA adapters
6. Train the model
7. Save the fine-tuned adapters

Training time depends on:
- Dataset size (~1700 examples)
- GPU availability (will use GPU if available, otherwise CPU)
- Batch size and number of epochs

**Expected time on CPU**: Several hours
**Expected time on GPU**: 30-60 minutes

## Using the Fine-Tuned Model

### Option 1: Use the Fine-Tuned Translator

Use `translator_finetuned.py` which automatically loads the fine-tuned model:

```python
from translator_finetuned import translate_tn_to_en

text = "عالسلامة أختي"
translation = translate_tn_to_en(text)
print(translation)
```

### Option 2: Update Existing Translator

Update `translator.py` or `test_asr.py` to use the fine-tuned model. Modify the import:

```python
# Change from:
from translator import translate_tn_to_en

# To:
from translator_finetuned import translate_tn_to_en
```

### Configuration

In `translator_finetuned.py`, you can configure:

```python
FINETUNED_MODEL_PATH = "nllb-lora-tunisian-en"  # Path to your fine-tuned model
USE_FINETUNED = True  # Set to False to use base model only
```

## Model Output Structure

After training, you'll have:

```
nllb-lora-tunisian-en/
├── lora_adapters/          # LoRA adapter weights
│   ├── adapter_config.json
│   └── adapter_model.bin
├── config.json
├── tokenizer files...
└── training files...
```

## Tips for Better Results

1. **More Data**: Add more examples to your dataset
2. **Longer Training**: Increase `NUM_EPOCHS` (but watch for overfitting)
3. **Adjust LoRA Rank**: Try `LORA_R = 32` or `64` for more capacity
4. **Learning Rate**: Try `2e-5` or `1e-5` for more stable training
5. **Batch Size**: Increase if you have GPU memory available

## Troubleshooting

### Out of Memory Errors

- Reduce `BATCH_SIZE` (try 2 or 1)
- Reduce `MAX_LENGTH` (try 256)
- Use gradient checkpointing (add to training args)

### Poor Translation Quality

- Check dataset quality (clean any noise)
- Increase training epochs
- Increase LoRA rank
- Check if validation loss is decreasing

### Model Not Loading

- Verify the path in `FINETUNED_MODEL_PATH`
- Make sure training completed successfully
- Check that `lora_adapters/` folder exists

## Next Steps

After fine-tuning, you can:
1. Test the model on your transcriptions
2. Compare with base model translations
3. Iterate with more data or hyperparameter tuning
4. Export the model for deployment


# Quick Start Guide - Fine-Tuning NLLB-200

## ✅ What's Already Done
1. ✅ Dependencies installed (`peft`, `accelerate`, etc.)
2. ✅ GPU detected (GTX 1650)
3. ✅ Script configured for your GPU

## 🚀 Next Steps

### Option 1: Run Fine-Tuning Directly (Recommended)
```bash
python finetune_nllb_lora.py
```

**What to expect:**
- First run will download the model (~2.3 GB) - this takes 5-10 minutes
- Script will show GPU info
- Dataset will be loaded and processed
- Training will start (30-60 minutes on your GPU)

### Option 2: Test Setup First
If you want to verify everything works first:
```bash
python test_finetune_setup.py
```
(This will also download the model on first run)

## ⚠️ Common Issues & Solutions

### Issue: "Out of Memory" Error
**Solution:** Reduce batch size in `finetune_nllb_lora.py`:
```python
BATCH_SIZE = 2  # Change from 4 to 2
```

### Issue: Model Download Fails
**Solution:** Check internet connection. The model is ~2.3 GB.

### Issue: Slow Training
**Solution:** This is normal on first run. Subsequent runs will be faster.

## 📊 What Happens During Training

1. **Loading Phase** (5-10 min first time)
   - Downloads model if not cached
   - Loads dataset
   - Configures LoRA

2. **Training Phase** (30-60 min)
   - Shows progress every 10 steps
   - Saves checkpoints every 500 steps
   - Evaluates on validation set every 100 steps

3. **Completion**
   - Model saved to `nllb-lora-tunisian-en/`
   - Ready to use with `translator_finetuned.py`

## 🎯 After Training

Update your translator to use the fine-tuned model:
```python
from translator_finetuned import translate_tn_to_en
```

Or update `test_asr.py`:
```python
from translator_finetuned import translate_tn_to_en
```


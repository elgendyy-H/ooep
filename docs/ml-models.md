
---

### 139. `docs/ml-models.md`
```markdown
# Machine Learning Models

OEPP uses a **Random Forest classifier** to predict finding severity from the title and description.

## Model Training

Run the training script manually (after gathering enough findings):

```bash
cd backend
python scripts/train_model.py
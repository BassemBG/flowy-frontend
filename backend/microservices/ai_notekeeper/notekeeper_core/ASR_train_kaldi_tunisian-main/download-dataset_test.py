from datasets import load_dataset

# Load the full dataset
dataset = load_dataset("linagora/linto-dataset-audio-ar-tn")

# For example, check the test split
test_split = dataset["test"]
print(test_split)

import json
import csv
import os

def jsonl_to_csv(input_path: str = "data/labeled_logs.jsonl", output_path: str = "data/labeled_logs.csv"):
    """Convert labeled JSONL logs to CSV for ML training."""
    print(f"Converting {input_path} to {output_path}...")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    # Define the fields to include in the CSV
    fieldnames = [
        "timestamp", 
        "ip_address", 
        "user_id", 
        "event_type", 
        "port_number", 
        "status", 
        "request_payload", 
        "label", 
        "detection_reason"
    ]

    count = 0
    # Try multiple encodings for robustness
    encodings = ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be']
    current_encoding = 'utf-8'
    
    for enc in encodings:
        try:
            with open(input_path, 'r', encoding=enc) as f:
                f.readline()
            current_encoding = enc
            break
        except Exception:
            continue

    with open(input_path, 'r', encoding=current_encoding, errors='ignore') as infile:
        with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for line in infile:
                if not line.strip():
                    continue
                try:
                    log = json.loads(line)
                    # Filter only the fields we want, handling missing keys
                    row = {field: log.get(field, "") for field in fieldnames}
                    writer.writerow(row)
                    count += 1
                except json.JSONDecodeError:
                    continue

    print(f"Successfully converted {count:,} logs to CSV.")
    print(f"Output: {output_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Convert JSONL logs to CSV')
    parser.add_argument('-i', '--input', default='data/labeled_logs.jsonl', help='Input JSONL file')
    parser.add_argument('-o', '--output', default='data/labeled_logs.csv', help='Output CSV file')
    
    args = parser.parse_args()
    jsonl_to_csv(args.input, args.output)

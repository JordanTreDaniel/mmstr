#!/bin/bash
# Quick setup script for AWS resources needed before Terraform

set -e

echo "======================================"
echo "MMSTR AWS Infrastructure Setup"
echo "======================================"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Check AWS profile
echo "Checking AWS profile..."
if ! aws sts get-caller-identity --profile personal &> /dev/null; then
    echo "❌ AWS profile 'personal' not configured or not working."
    echo "Run: aws configure --profile personal"
    exit 1
fi

export AWS_PROFILE=personal
echo "✓ Using AWS profile: personal"
echo ""
echo "This would have worked, but I already ran this for this app on Nov 10th 2025. Uncomment to rebuild if it's been destroyed."
# # 1. Create S3 bucket for Terraform state
# echo "1. Creating S3 bucket for Terraform state..."
# if aws s3 ls s3://mmstr-tf-state 2>&1 | grep -q 'NoSuchBucket'; then
#     aws s3api create-bucket \
#         --bucket mmstr-tf-state \
#         --region us-east-2 \
#         --create-bucket-configuration LocationConstraint=us-east-2
    
#     aws s3api put-bucket-versioning \
#         --bucket mmstr-tf-state \
#         --versioning-configuration Status=Enabled
    
#     echo "✓ S3 bucket created: mmstr-tf-state"
# else
#     echo "✓ S3 bucket already exists: mmstr-tf-state"
# fi
# echo ""

# # 2. Create DynamoDB table for state locking
# echo "2. Creating DynamoDB table for state locking..."
# if ! aws dynamodb describe-table --table-name mmstr-terraform-locks --region us-east-2 &> /dev/null; then
#     aws dynamodb create-table \
#         --table-name mmstr-terraform-locks \
#         --attribute-definitions AttributeName=LockID,AttributeType=S \
#         --key-schema AttributeName=LockID,KeyType=HASH \
#         --billing-mode PAY_PER_REQUEST \
#         --region us-east-2
    
#     echo "✓ DynamoDB table created: mmstr-terraform-locks"
# else
#     echo "✓ DynamoDB table already exists: mmstr-terraform-locks"
# fi
# echo ""

# # 3. Create EC2 Key Pair
# echo "3. Creating EC2 key pair..."
# KEY_PATH="$HOME/.ssh/mmstr-key.pem"
# if [ ! -f "$KEY_PATH" ]; then
#     aws ec2 create-key-pair \
#         --key-name mmstr-key \
#         --region us-east-2 \
#         --query 'KeyMaterial' \
#         --output text > "$KEY_PATH"
    
#     chmod 400 "$KEY_PATH"
#     echo "✓ EC2 key pair created: $KEY_PATH"
# else
#     echo "✓ EC2 key pair already exists: $KEY_PATH"
# fi
# echo ""

# 4. Allocate Elastic IP
# echo "4. Allocating Elastic IP..."
# EIP_ALLOC_ID=$(aws ec2 allocate-address --domain vpc --region us-east-2 --query 'AllocationId' --output text 2>&1)
# if [[ "$EIP_ALLOC_ID" == eipalloc-* ]]; then
#     PUBLIC_IP=$(aws ec2 describe-addresses --allocation-ids "$EIP_ALLOC_ID" --region us-east-2 --query 'Addresses[0].PublicIp' --output text)
#     echo "✓ Elastic IP allocated:"
#     echo "  Allocation ID: $EIP_ALLOC_ID"
#     echo "  Public IP: $PUBLIC_IP"
# else
#     echo "ℹ Note: Elastic IP allocation may have failed (you might already have one)"
#     echo "  Check with: aws ec2 describe-addresses --region us-east-2"
# fi
# echo ""

# echo "======================================"
# echo "Setup Complete!"
# echo "======================================"
# echo ""
# echo "Next steps:"
# echo "1. Update DNS: Add A record for mmstr.jordanchristley.com -> $PUBLIC_IP"
# echo "2. Copy terraform.tfvars.example to terraform.tfvars"
# echo "3. Edit terraform.tfvars with:"
# echo "   - elastic_ip_allocation_id = \"$ALLOCATION_ID\""
# echo "   - ssh_private_key_path = \"$KEY_PATH\""

# echo "   - github_ssh_key_path = \"/path/to/your/github/key\""
# echo "   - app_repo = \"git@github.com:JordanTreDaniel/mmstr.git\""
# echo "   - ssl_email = \"lilj390150@yahoo.com\""
# echo "4. Run: terraform init && terraform plan && terraform apply"
# echo ""


# MMSTR Infrastructure Deployment

This directory contains Terraform configuration to deploy the MMSTR Next.js app to AWS EC2.

## Prerequisites

1. **AWS CLI** configured with your personal profile:
   ```bash
   aws configure --profile personal
   export AWS_PROFILE=personal
   ```

2. **Terraform** installed (https://www.terraform.io/downloads)

3. **GitHub SSH Deploy Key** (read-only access to your repo)

## Setup Steps

### 1. Create S3 Backend (First Time Only)

```bash
# Switch to personal AWS profile
export AWS_PROFILE=personal

# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket mmstr-tf-state \
  --region us-east-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket mmstr-tf-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name mmstr-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2
```

### 2. Create EC2 Key Pair

```bash
# Create key pair in AWS
aws ec2 create-key-pair \
  --key-name mmstr-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/mmstr-key.pem

# Set permissions
chmod 400 ~/.ssh/mmstr-key.pem
```

### 3. Allocate Elastic IP

```bash
aws ec2 allocate-address --domain vpc --region us-east-2
```

Save the `AllocationId` and `PublicIp` from the output.

### 4. Update DNS

Add an A record to your DNS:
- **Name**: `mmstr.jordanchristley.com`
- **Type**: A
- **Value**: [The PublicIp from step 3]

Wait for DNS propagation (can take a few minutes to hours).

### 5. Configure Terraform

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
- Update `elastic_ip_allocation_id` with the allocation ID from step 3
- Update `aws_ssh_private_key_path` to point to your key
- Update `github_ssh_private_key_path` to your GitHub deploy key
- Update `app_repo` to your mmstr repo URL
- Update `ssl_email` with your email

### 6. Create .env.production (Optional)

If your app needs environment variables, create `.env.production` in the root of the mmstr directory (one level up from infra/).

### 7. Deploy

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

The deployment will:
1. Create an EC2 instance
2. Install Node.js, nginx, and dependencies
3. Clone your repository
4. Build the Next.js app
5. Set up SSL with Let's Encrypt
6. Start the app as a systemd service

This typically takes 10-15 minutes.

## Post-Deployment

Your app will be live at: `https://mmstr.jordanchristley.com`

### SSH Access

```bash
ssh -i ~/.ssh/mmstr-key.pem ec2-user@mmstr.jordanchristley.com
```

### Check Service Status

```bash
sudo systemctl status mmstr
sudo journalctl -u mmstr -f  # View logs
```

### Manual Deployment Update

```bash
ssh -i ~/.ssh/mmstr-key.pem ec2-user@mmstr.jordanchristley.com
cd ~/mmstr
git pull
npm install
npm run build
sudo systemctl restart mmstr
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Don't forget to also:
- Release the Elastic IP in AWS Console
- Delete the S3 bucket and DynamoDB table if you're done with them


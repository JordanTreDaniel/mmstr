# MMSTR Quick Deployment Guide

## Fastest Path to Deployment (30-45 mins)

### Step 1: AWS Setup (5 mins)
```bash
cd /Users/jnakamoto/dev/communication-apps/mmstr/infra
./setup-aws.sh
```

This creates:
- S3 bucket for Terraform state
- DynamoDB table for state locking
- EC2 key pair
- Elastic IP

**Save the Allocation ID and Public IP from the output!**

### Step 2: DNS Setup (2 mins + propagation time)
Add an A record to your DNS provider:
- **Hostname**: `mmstr` (or `mmstr.jordanchristley.com` depending on your DNS provider)
- **Type**: A
- **Value**: [The Public IP from Step 1]
- **TTL**: 300 (or auto)

### Step 3: GitHub Deploy Key (3 mins)
If you don't have one already:

```bash
# Generate deploy key
ssh-keygen -t ed25519 -C "mmstr-deploy" -f ~/.ssh/mmstr-github-deploy-key

# Copy public key
cat ~/.ssh/mmstr-github-deploy-key.pub

# Add to GitHub:
# Go to your repo → Settings → Deploy keys → Add deploy key
# Paste the public key, give it a title, DON'T check "Allow write access"
```

### Step 4: Configure Terraform (3 mins)
```bash
cd /Users/jnakamoto/dev/communication-apps/mmstr/infra
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # or use your preferred editor
```

Update these values:
- `elastic_ip_allocation_id` - from Step 1
- `aws_ssh_private_key_path` - should be `~/.ssh/mmstr-key.pem`
- `github_ssh_private_key_path` - path to your deploy key (e.g., `~/.ssh/mmstr-github-deploy-key`)
- `app_repo` - your mmstr GitHub repo URL (e.g., `git@github.com:yourusername/mmstr.git`)
- `ssl_email` - your email for Let's Encrypt notifications

### Step 5: Create .env.production (optional, 1 min)
If your app needs environment variables:

```bash
cd /Users/jnakamoto/dev/communication-apps/mmstr
nano .env.production
```

Add your environment variables. Example:
```env
DATABASE_URL=/home/ec2-user/mmstr/data/app.db
NODE_ENV=production
```

### Step 6: Deploy! (15-20 mins)
```bash
cd /Users/jnakamoto/dev/communication-apps/mmstr/infra

# Make sure you're using the right AWS profile
export AWS_PROFILE=personal

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Deploy!
terraform apply
```

Type `yes` when prompted. The deployment will:
1. Launch EC2 instance
2. Install Node.js, nginx
3. Clone your repo
4. Build the app
5. Configure SSL with Let's Encrypt
6. Start the app

**Important**: Wait for DNS to propagate before SSL setup. If SSL fails, you can run it manually later (see troubleshooting).

### Step 7: Verify
After deployment completes:

```bash
# Check if site is up (might take 1-2 mins for SSL)
curl https://mmstr.jordanchristley.com

# SSH into server
ssh -i ~/.ssh/mmstr-key.pem ec2-user@mmstr.jordanchristley.com

# Check service status
sudo systemctl status mmstr
```

## Common Issues

### Issue: SSL Certificate Fails
If DNS hasn't propagated yet, SSL setup will fail. Fix it manually:

```bash
ssh -i ~/.ssh/mmstr-key.pem ec2-user@mmstr.jordanchristley.com
sudo certbot --nginx --non-interactive --agree-tos --email your@email.com -d mmstr.jordanchristley.com --redirect
```

### Issue: App won't start
Check logs:
```bash
sudo journalctl -u mmstr -n 50
```

Common fixes:
- Missing dependencies: `cd ~/mmstr && npm install`
- Build failed: `cd ~/mmstr && npm run build`
- Restart: `sudo systemctl restart mmstr`

### Issue: Can't connect via SSH
- Check security group allows port 22 from your IP
- Verify key permissions: `chmod 400 ~/.ssh/mmstr-key.pem`
- Use the Elastic IP: `ssh -i ~/.ssh/mmstr-key.pem ec2-user@[ELASTIC_IP]`

## Updating Your App

To deploy new changes:

```bash
ssh -i ~/.ssh/mmstr-key.pem ec2-user@mmstr.jordanchristley.com
cd ~/mmstr
git pull
npm install
npm run build
sudo systemctl restart mmstr
```

Or create a deploy script on the server.

## Cleanup

To destroy everything:
```bash
cd /Users/jnakamoto/dev/communication-apps/mmstr/infra
terraform destroy
```

## Cost Estimate

- t3.small EC2: ~$15/month
- Elastic IP: Free while attached, $3.65/month if not attached
- Data transfer: Usually under $1/month for low traffic

**Total: ~$15-20/month**


########################################################
# Terraform Setup for MMSTR Deployment
########################################################

terraform {
  backend "s3" {
    bucket         = "mmstr-tf-state"
    key            = "terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "mmstr-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
}

resource "aws_eip_association" "mmstr_eip_assoc" {
  instance_id   = aws_instance.mmstr.id
  allocation_id = var.elastic_ip_allocation_id
}

resource "aws_instance" "mmstr" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name              = var.key_name
  vpc_security_group_ids = [aws_security_group.mmstr_sg.id]

  tags = {
    Name = "mmstr-app"
  }

  # Copy configuration files
  provisioner "file" {
    source      = "${path.module}/files/mmstr.service"
    destination = "/tmp/mmstr.service"

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file(var.aws_ssh_private_key_path)
      host        = self.public_ip
    }
  }

  provisioner "file" {
    source      = "${path.module}/files/nginx.conf"
    destination = "/tmp/mmstr.conf"

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file(var.aws_ssh_private_key_path)
      host        = self.public_ip
    }
  }

  # Copy GitHub SSH key
  provisioner "file" {
    source      = var.github_ssh_private_key_path
    destination = "/tmp/github_deploy_key"

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file(var.aws_ssh_private_key_path)
      host        = self.public_ip
    }
  }

  # Copy known_hosts
  provisioner "file" {
    source      = "${path.module}/files/known_hosts"
    destination = "/tmp/known_hosts"

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file(var.aws_ssh_private_key_path)
      host        = self.public_ip
    }
  }

  # Copy .env file (if exists)
  provisioner "file" {
    source      = "../.env.production"
    destination = "/tmp/app.env"

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file(var.aws_ssh_private_key_path)
      host        = self.public_ip
    }
  }

  # Initial setup
  provisioner "remote-exec" {
    inline = [
      # Update system
      "sudo dnf update -y",
      "sudo dnf install -y git nginx",
      
      # Install nvm and Node.js 20.11.1
      "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
      "source ~/.bashrc",
      "export NVM_DIR=\"$HOME/.nvm\"",
      "[ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\"",
      "nvm install 20.11.1",
      "nvm alias default 20.11.1",
      
      # Set up GitHub SSH access
      "mkdir -p ~/.ssh",
      "chmod 700 ~/.ssh",
      "mv /tmp/known_hosts ~/.ssh/known_hosts",
      "mv /tmp/github_deploy_key ~/.ssh/id_rsa",
      "chmod 600 ~/.ssh/id_rsa",
      "ssh-keyscan github.com >> ~/.ssh/known_hosts",
      
      # Clone repository and build
      "git clone ${var.app_repo} /home/ec2-user/mmstr",
      
      # Setup app with env
      "cd /home/ec2-user/mmstr",
      "mv /tmp/app.env .env.production || true",
      "chmod 600 .env.production || true",
      "source ~/.nvm/nvm.sh && npm install",
      "source ~/.nvm/nvm.sh && npm run build",
      
      # Set up Nginx
      "sudo mv /tmp/mmstr.conf /etc/nginx/conf.d/",
      "sudo systemctl enable nginx",
      "sudo systemctl start nginx",
      
      # Set up systemd service
      "sudo mv /tmp/mmstr.service /etc/systemd/system/",
      "sudo systemctl daemon-reload",
      
      # Start application service
      "sudo systemctl enable mmstr",
      "sudo systemctl start mmstr",

      # Install Certbot and set up SSL (moved to end, simplified conditions)
      "sudo dnf install -y certbot python3-certbot-nginx cronie",
      
      # Set up SSL certificate
      "sudo certbot --nginx --non-interactive --agree-tos --email ${var.ssl_email} -d ${var.domain_name} --redirect",
      
      # Set up automatic renewal
      "sudo systemctl enable crond",
      "sudo systemctl start crond",
      "(sudo crontab -l 2>/dev/null; echo '0 0,12 * * * /usr/bin/certbot renew --quiet') | sudo crontab -"
    ]

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file(var.aws_ssh_private_key_path)
      host        = self.public_ip
    }
  }
}

resource "aws_security_group" "mmstr_sg" {
  name        = "mmstr_sg"
  description = "Allow HTTP, HTTPS, and SSH"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
} 
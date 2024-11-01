provider "aws" {
  region = "ap-southeast-2"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
    enable_dns_support = true
  enable_dns_hostnames = true


  tags = {
    Name = "akademi-koding-vpc"
  }
}

resource "aws_internet_gateway" "internet-gateway" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "akademi-koding-internet-gateway"
  }

}

resource "aws_subnet" "public-subnet" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-southeast-2a"
  map_public_ip_on_launch = true

  tags = {
    Name = "akademi-koding-subnet-public-1"
  }
}

resource "aws_subnet" "public-subnet-2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-southeast-2b"
  map_public_ip_on_launch = true
  tags = {
    Name = "akademi-koding-subnet-public-2"
  }

}

resource "aws_subnet" "private-subnet" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.100.0/24"
  availability_zone = "ap-southeast-2a"

  tags = {
    Name = "akademi-koding-subnet-private-1"
  }
}

resource "aws_subnet" "private-subnet-2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.101.0/24"
  availability_zone = "ap-southeast-2b"
  tags = {
    Name = "akademi-koding-subnet-private-2"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.private-subnet.id
}

resource "aws_route_table" "private-route-table" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
}

resource "aws_route_table_association" "private-route-table-association" {
  subnet_id      = aws_subnet.private-subnet.id
  route_table_id = aws_route_table.private-route-table.id
}

resource "aws_route_table" "public-route-table" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet-gateway.id
  }
}

resource "aws_route_table_association" "public-route-table-association" {
  subnet_id      = aws_subnet.public-subnet.id
  route_table_id = aws_route_table.public-route-table.id
}

resource "aws_security_group" "allow_access" {
  name   = "allow_access"
  vpc_id = aws_vpc.main.id
  tags = {
    name = "allow_access"
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_rds" {
  security_group_id = aws_security_group.allow_access.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 3306
  ip_protocol       = "tcp"
  to_port           = 3306
}

resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
  security_group_id = aws_security_group.allow_access.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "allow_outbound" {
  security_group_id = aws_security_group.allow_access.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 0
  ip_protocol       = "tcp"
  to_port           = 65535
}

# # resource "aws_instance" "akademi-koding" {
# #     ami           = "ami-06b21ccaeff8cd686"
# #     instance_type = "t2.micro"
# #     subnet_id     = aws_subnet.public-subnet.id
# #     vpc_security_group_ids = [aws_security_group.allow_access.id]

# #     tags = {
# #         Name = "akademi-koding"
# #     }
# # }

resource "aws_db_subnet_group" "akademi-koding-subnet-group" {
  name       = "akademi-koding-subnet-group"
  subnet_ids = [aws_subnet.private-subnet.id, aws_subnet.private-subnet-2.id]
  tags = {
    Name = "Akademi Koding Subnet Group"
  }
}


resource "aws_db_instance" "akademi-koding-rds" {
  allocated_storage    = 10
  db_name              = "akademikoding"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  username             = "akademikoding"
  password             = "Nikf_Mbek_Mb_ganteng123"
  parameter_group_name = "default.mysql8.0"
  publicly_accessible    = true
  skip_final_snapshot    = true
  storage_encrypted      = true
  identifier = "akademi-koding-rds"
}

output "rds_endpoint" {
  value = aws_db_instance.akademi-koding-rds.endpoint
}
#!/bin/bash

set -e

echo "Start configuring server"

if [ "$EUID" -ne 0 ]; then
  echo "Error: this script must be run via sudo!"
  echo "Use: sudo ./setup.sh"
  exit 1
fi

echo "Installing system packages"

apt update

apt install -y nginx postgresql postgresql-contrib curl

if ! command -v node > /dev/null; then
  echo "Installing Node.js"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
else
  echo "Node.js is already installed"
fi

echo "Creating users and setting permissions"

if ! id "student" &>/dev/null; then
  echo "Creating user: student"
  useradd -m -s /bin/bash student
  echo "student:12345678" | chpasswd
  usermod -aG sudo student
else
  echo "User student already exists"
fi

if ! id "teacher" &>/dev/null; then
  echo "Creating user: teacher"
  useradd -m -s /bin/bash teacher
  echo "teacher:12345678" | chpasswd
  usermod -aG sudo teacher
  chage -d 0 teacher
else
  echo "User teacher already exists"
fi

if ! id "operator" &>/dev/null; then
  echo "Creating user: operator"
  
  if getent group operator > /dev/null; then
    useradd -m -s /bin/bash -g operator operator
  else
    useradd -m -s /bin/bash operator
  fi

  echo "operator:12345678" | chpasswd
  chage -d 0 operator
else
  echo "User operator already exists"
fi

if ! id "app" &>/dev/null; then
  echo "Creating user: app"
  useradd -r -s /usr/sbin/nologin app
else
  echo "User app already exists"
fi

echo "Configuring sudo previleges for operator"

cat <<EOF > /etc/sudoers.d/operator
operator ALL=(ALL) NOPASSWD: /bin/systemctl start mywebapp.service, /bin/systemctl stop mywebapp.service, /bin/systemctl restart mywebapp.service, /bin/systemctl status mywebapp.service, /bin/systemctl reload nginx
EOF
chmod 0440 /etc/sudoers.d/operator

echo "Configuring PostgreSQL"

sudo -u postgres psql -c "CREATE ROLE student WITH LOGIN PASSWORD 'mypassword';" || true
sudo -u postgres psql -c "CREATE DATABASE notes_db OWNER student;" || true

echo "Deploying application to /opt/mywebapp"

mkdir -p /opt/mywebapp

rsync -av --exclude='setup.sh' ./* /opt/mywebapp/

cd /opt/mywebapp
echo "Installing npm dependencies"
npm install 

chown -R app:app /opt/mywebapp

echo "Configuring application settings"

mkdir -p /etc/mywebapp
cp /opt/mywebapp/config.json /etc/mywebapp/config.json
chown -R app:app /etc/mywebapp
chmod 600 /etc/mywebapp/config.json

echo "Creating gradebook"
echo "27" > /home/student/gradebook
chown student:student /home/student/gradebook

echo "Configuring systemd socket and service"

cat << 'EOF' > /etc/systemd/system/mywebapp.socket
[Unit]
Description=Socket for mywebapp

[Socket]
ListenStream=3000

[Install]
WantedBy=sockets.target
EOF

cat << 'EOF' > /etc/systemd/system/mywebapp.service
[Unit]
Description=Node.js Notes Service
Requires=mywebapp.socket
After=network.target postgresql.service mywebapp.socket

[Service]
Type=simple
User=app
WorkingDirectory=/opt/mywebapp
ExecStartPre=/usr/bin/node /opt/mywebapp/migrate.js
ExecStart=/usr/bin/node /opt/mywebapp/app.js
Restart=on-failure
Environment=NODE_ENV=production
EOF

systemctl daemon-reload

systemctl disable mywebapp.service || true
systemctl stop mywebapp.service || true

systemctl enable mywebapp.socket
systemctl start mywebapp.socket

echo "Configuring Nginx"

cat << 'EOF' > /etc/nginx/sites-available/mywebapp
server {
  listen 80;
  server_name _;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF

ln -sf /etc/nginx/sites-available/mywebapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

systemctl restart nginx

echo "Setup finished!"

echo "Locking default installation user"

if [ -n "$SUDO_USER" ]; then
  usermod -L "$SUDO_USER"
  echo "User $SUDO_USER has been locked for security reasons"
fi
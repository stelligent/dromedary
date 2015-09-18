#
# Cookbook Name:: dromedary
# Recipe:: node_modules
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

remote_directory '/dromedary' do
  source 'app'
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

directory '/dromedary/log' do
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

bash 'dromedary' do
  user 'root'
  flags '-ex'
  code <<-EOH
if /usr/local/bin/forever list | grep -q '^data:'; then
  /usr/local/bin/forever stopall
  sleep 1
fi
/usr/local/bin/forever /dromedary/app.js >> /dromedary/log/server.log 2>&1 &
EOH
end

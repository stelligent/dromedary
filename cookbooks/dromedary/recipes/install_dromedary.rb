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

execute 'dromedary' do
  user 'root'
  command '/usr/bin/forever /dromedary/app.js > /dromedary/log/server.log 2>&1 &'
end

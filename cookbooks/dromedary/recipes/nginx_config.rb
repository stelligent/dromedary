#
# Cookbook Name:: dromedary
# Recipe:: nginx_config
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

cookbook_file '/etc/nginx/sites-available/dromedary' do
  source 'nginx/dromedary-site.cfg'
  owner 'root'
  group 'root'
  mode '0644'
  action :create
end

link '/etc/nginx/sites-enabled/000-default' do
  to '/etc/nginx/sites-available/dromedary'
end

service 'nginx' do
  action [ :start, :enable ]
end

#
# Cookbook Name:: dromedary
# Recipe:: node_modules
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

include_recipe 'tarball::default'

s3_url = "https://s3.amazonaws.com/#{node[:dromedary][:S3Bucket]}/#{node[:dromedary][:ArtifactPath]}" 

remote_file "/tmp/dromedary.tar.gz" do
  source s3_url
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

%w[ /dromedary /dromedary/log ].each do |path|
  directory path do
    owner 'root'
    group 'root'
    mode '0755'
  end
end

tarball '/tmp/dromedary.tar.gz' do
  destination '/dromedary'
  owner 'root'
  group 'root'
  action :extract
end

execute 'npm_install' do
  user 'root'
  cwd '/dromedary'
  command 'npm install'
end

execute 'dromedary' do
  user 'root'
  command '/usr/bin/forever /dromedary/app.js > /dromedary/log/server.log 2>&1 &'
end


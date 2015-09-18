#
# Cookbook Name:: dromedary
# Recipe:: nodejs
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute

## NOTE: Moved nodejs install to this cookbook
## It'd be nice to use an open source cookbook, but the one Jonny found
## installed a very old version of node. Thie version matches what is installed
## on our Macbooks via Homebrew.
remote_file '/tmp/node-install.tar.gz' do
  source "https://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz"
  owner 'root'
  group 'root'
  mode '0644'
  action :create
end

bash 'install nodejs' do
  user 'root'
  flags '-ex'
  cwd '/usr/local'
  code 'tar --strip-components 1 -xzf /tmp/node-install.tar.gz'
end

bash 'symlink nodejs' do
  user 'root'
  flags '-ex'
  cwd '/usr/local'
  code 'test -L /usr/bin/node || ln -s /usr/local/bin/node /usr/bin/node'
end

bash 'install forever' do
  user 'root'
  flags '-ex'
  code '/usr/local/bin/npm install -g forever@0.15.1'
end

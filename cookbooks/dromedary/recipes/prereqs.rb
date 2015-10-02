#
# Cookbook Name:: dromedary
# Recipe:: prereqs
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

if ['rhel', 'amazon'].include?(node['platform'])
  execute 'yum upgrade -y'
end
if ['ubuntu'].include?(node['platform'])
  execute 'aptitude update'
  execute 'aptitude upgrade -y'
end

include_recipe 'nginx'
include_recipe 'dromedary::nodejs'
include_recipe 'dromedary::yum_packages'

service 'nginx' do
  action [ :stop, :disable ]
end

execute 'touch /.dromedary-prereqs-installed'

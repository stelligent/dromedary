#
# Cookbook Name:: dromedary
# Recipe:: node_modules
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

%w[ /dromedary /dromedary/log /dromedary/public /dromedary/lib].each do |path|
  directory path do
    owner 'root'
    group 'root'
    mode '0755'
  end
end

%w[ app.js appspec.yml public/charthandler.js lib/inMemoryStorage.js public/index.html package.json lib/requestThrottle.js lib/sha-raw.js lib/sha.js ].each do |file|
  cookbook_file "/dromedary/#{file}" do
    source file
    owner 'root'
    group 'root'
    mode '0755'
    action :create
  end
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


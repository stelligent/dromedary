#
# Cookbook Name:: dromedary
# Recipe:: prereqs
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

include_recipe 'nginx'
include_recipe 'dromedary::nodejs'
include_recipe 'dromedary::yum_packages'

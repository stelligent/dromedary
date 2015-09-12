#
# Cookbook Name:: dromedary
# Recipe:: default
#
# Copyright (C) 2015 Stelligent
#
# All rights reserved - Do Not Redistribute
#

include_recipe 'dromedary::node_modules'
include_recipe 'dromedary::yum_packages'
# include_recipe 'dromedary::code_deploy'

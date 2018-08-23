
# Makefile
# see https://www.gnu.org/software/make/manual/make.html


# VARIABLES

NAME := paolocarta.me
BUILD_TOOL := bundle exec

build :	# The current folder will be generated into ./_site
	$(BUILD_TOOL) jekyll build 

serve :		## Build the application excluding tests
	$(BUILD_TOOL) jekyll serve --livereload 

install-jekyll :	# Install Jekyll and Bundler gems through RubyGems
	gem install jekyll bundler

create-website :	# Create a new Jekyll site at .
	jekyll new . --force

fetch-dependencies : 	
	$(BUILD_TOOL) update






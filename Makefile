
# Makefile
# see https://www.gnu.org/software/make/manual/make.html


# VARIABLES

NAME := paolocarta.me
BUILD_TOOL := bundle

# BUILDING

build :		## Build the application excluding tests
	$(BUILD_TOOL) exec jekyll serve

# TESTING

# RUNNING




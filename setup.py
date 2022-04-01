from setuptools import setup, find_packages
from os import path

here = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(here, "README.md"), encoding="utf-8") as f:
    long_description = f.read()

# Arguments marked as "Required" below must be included for upload to PyPI.
# Fields marked as "Optional" may be commented out.

setup(
    name="batamp-viz",
    version="0.2.0",
    description="Bat Acoustic Monitoring Visualization Tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/consbio/batamp-viz",
    author="Brendan C. Ward",
    keywords="bats wildlife data visualization",
    install_requires=[
        "pandas",
        "geopandas",
        "python-databasin",
        "python-dotenv",
    ],
    extras_require={"dev": ["black", "pylint"]},
)

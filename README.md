Junit XML result formatter for the DaSpec JS Node runner - helpful for integrating DaSpec with continuous integration servers.

# Installation

In your project, install the daspec node runner

    npm install daspec --save-dev

Then install the JUnit XML reporter
    
    npm install daspec-junit-xml-formatter --save-dev

Add the `daspec-junit-xml-formatter` to the formatters when you run `daspec` from the command line

    daspec --specs ... --steps ... --formatters daspec-junit-xml-formatter

Alternatively, set the formatters in your `daspec.json` config file

    {
      ...
      "formatters": [... , "daspec-junit-xml-formatter"],
      ...
    }
   
## Changing the default output file

By default, the formatter will save the results in `report.xml` in the `output-dir` configured in the DaSpec settings. You can change this by setting the `junit-xml-file-name` configuration setting, either in the config file or using the `--junit-xml-file-name` argument when invoking DaSpec. If the file name does not contain a folder path, it will be saved in the `output-dir`. If the file name also contains a folder, then the `output-dir` setting is ignored, and the file is saved relative to the current process working directory.

For more information on configuring the DaSpec Node runner, see [http://daspec.com/guides/install.html](http://daspec.com/guides/install.html)

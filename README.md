Junit XML result formatter for the DaSpec JS Node runner - helpful for integrating DaSpec with continuous integration servers.

# Installation

In your project, install the daspec node runner

    npm install daspec --save-dev

Then install the JUnit XML reporter
    
    npm install daspec-junit-xml-formatter

Add the `daspec-junit-xml-formatter` to the formatters when you run `daspec` from the command line

    daspec --specs ... --steps ... --formatters daspec-junit-xml-formatter

Alternatively, set the formatters in your `daspec.json` config file

    {
      ...
      "formatters": [... , "daspec-junit-xml-formatter"],
      ...
    }
    

For more information on the DaSpec Node runner, see [http://daspec.com/guides/install.html](http://daspec.com/guides/install.html)

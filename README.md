# sf-voters
Map of voting in San Francisco

Data from [SF Dept of Elections](http://www.sfelections.org/results/20160607/#english_detail)  
Precinct shapefiles from [DataSF](https://data.sfgov.org/Geographic-Locations-and-Boundaries/Election-Precincts-Zipped-Shapefile-Format-/w3ua-z2my)

### data processing steps
1. download data file from [sfelections.org](http://www.sfelections.org/results/20161108/data/20161201/20161201_psov.xlsx)
1. separate xls file into individual csvs for each sheet using [getsheets.py script found here](http://superuser.com/questions/841398/how-to-convert-excel-file-with-multiple-sheets-to-a-set-of-csv-files)
1. rename directory created by getsheets.py: `$ mv 20161201_psov/ raw/`
1. clean up data using "clean" script `$ node clean.js`



### Libraries
[D3](http://d3js.org)  
[Bootstrap](http://getbootstrap.com)  
[jQuery](http://jquery.com)  
[Colorbrewer](http://colorbrewer2.org)  
[d3-legend](http://d3-legend.susielu.com/)  

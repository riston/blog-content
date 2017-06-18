+++
date = "2016-08-28T17:46:41+03:00"
draft = false
title = "Automating your SVG export"
description = "Easy way to automate your multi SVG object export"
tags = [ "SVG", "Automation", "Export" ]
+++

Exporting could be a quite tedious manual work if you have to do it like 20+ times.
Also, the GUI(graphical user interface) settings don't change much, only press export button.
With Native Mobile applications usually single size won't be enough and you have to do it again usually
in three different sizes. In this post let's go through some alternative options to make exporting much easier.

All the below techniques are used on SVG so if you have Adobe Illustrator content make sure you convert it to plain SVG before. For the exporting let's use [Inkscape](https://inkscape.org/en/), it's open source vector graphics editor, which works on all major platforms. Beside the Inkscape GUI, there is a CLI especially `--export*` [flags](https://inkscape.org/en/doc/inkscape-man.html) are interesting.

Let's go through some of the basic commands and ideas, for an example, I downloaded some cartoons from
[openclipart.org](https://openclipart.org/search/?query=cartoon). Instead of multiple files use the single file with multi-objects, usually for gaming, you have lots of small objects called sprites.

![Example animals picture](/images/svg-export/animals.png)

Next, let's create an SVG group for each animal and set the unique ID's. Select the animal and press
`CTRL+G` to create a group and for ungroup `SHIFT+CTRL+G`. Select the object and press `SHIFT+CTRL+O` opens object properties, the important field is `ID`. The ID field in each document is unique, so it's a good idea to add some prefix, example `animal-[lion, goat, dragon]`. Save the document and now we are ready for the PNG export.

As first example export the only lion, as the lion SVG group is called `animal-lion` it's easy to export it by id.

{{< highlight bash >}}
inkscape --export-id=animal-lion -e lion.png animals.svg

Background RRGGBBAA: ffffff00
Area 67.7339:482.131:343.695:912.155 exported to 276 x 430 pixels (90 dpi)
Bitmap saved as: lion.png
{{< /highlight >}}

The default options show the DPI is set to 90, let's go for the 2X and 3X DPI set the `--export-dpi` parameter.

{{< highlight bash >}}
for i in {1..3}; do inkscape --export-dpi="$((i * 90))" --export-id=animal-lion -e lion-${i}X.png static/img/automate-svg-export/animals.svg; done
{{< /highlight >}}

<div>
    <div style="margin: 0 auto";>
        <img style="width: 10%;" src="/images/svg-export/lion-1X.png">
        <img style="width: 20%;" src="/images/svg-export/lion-2X.png">
        <img style="width: 30%;" src="/images/svg-export/lion-3X.png">
    </div>
</div>

This makes life easier, but the problem is that you have to know IDs. One possible solution
is to use Python script [svg-objects-export](https://github.com/berteh/svg-objects-export) which
allows object selection with a regular expression and XPath. Example, let's export all the animals from SVG with `--pattern 'animal-'`.

{{< highlight bash >}}
./svg-objects-export.py --prefix '' --pattern 'animal-'animals.svg

exporting from static/img/automate-svg-export/animals.svg all objects matching animal-
  animal-lion to animal-lion.png
Background RRGGBBAA: ffffff00
Area 67.7339:482.131:343.695:912.155 exported to 276 x 430 pixels (90 dpi)
Bitmap saved as: animal-lion.png
  animal-dragon to animal-dragon.png
Background RRGGBBAA: ffffff00
Area 438.439:534.348:686.639:825.652 exported to 248 x 291 pixels (90 dpi)
Bitmap saved as: animal-dragon.png
  animal-goat to animal-goat.png
Background RRGGBBAA: ffffff00
Area 84.4715:131.489:332.671:422.796 exported to 248 x 291 pixels (90 dpi)
Bitmap saved as: animal-goat.png
{{< /highlight >}}

For gaming, if you are exporting a large set of sprites there is a free tool to create sprite sheets. Sprite sheets make image loading for the web much simpler also much efficient. Instead of downloading each image separately you need to download usually two files. First, where the images are combined into a single image and another file, contains image position mapping, usually JSON file.

<div>
    <div style="margin: 0 auto";>
        <img style="width: 30%;" src="/images/svg-export/animal-lion.png">
        <img style="width: 30%;" src="/images/svg-export/animal-goat.png">
        <img style="width: 30%;" src="/images/svg-export/animal-dragon.png">
    </div>
</div>

Automating your image exporting could save a lot of times, especially if your experimenting different image sizes, colours, etc. These Inkscape features aren't widely used because many people still scare command line tooling, don't be this saves a lot of time!

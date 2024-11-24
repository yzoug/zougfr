+++
title = "Quick Jekyll and Lanyon intro"
date = 2016-07-09
+++

# Archived content

This article was written years ago (`2016-07-09`). You're probably better off reading the up-to-date quickstart for Jekyll instead, but it's a cool read nonetheless.

---

Maybe you've heard of [Jekyll](http://jekyllrb.com/). It's an open-source static site generator that lets you write content, create a template, build and obtain static webpages ready to be served by your favorite webserver.

And since Jekyll doesn't use SQL or PHP or anything for the end product, it's really fast and requires very little maintenance, once your website is built. It's also a lot more secure than a full CMS: less parts means less places where things could go wrong.

[Lanyon](http://lanyon.getpoole.com/), on the other hand, is a free theme for Jekyll that looks beautiful and focuses on the content. A previous version of this website used Jekyll and Lanyon, so let me walk you through everything you need to start writing your content!

## Installation

Jekyll is a Ruby app, so we'll use Rubygems to install it. You'll also need git to clone the repository of Lanyon. On Debian-based distros:

```
# aptitude install ruby git
```

Now we'll install Jekyll and jekyll-paginate (necessary for Lanyon), and clone the git repository of Lanyon:

```
$ gem install jekyll jekyll-paginate  
$ git clone https://github.com/poole/lanyon.git  
```

You'll have the latest Jekyll version (3.1.6 as of today). Unfortunately Lanyon is built for Jekyll 2.x, we'll have to modify a few things before being able to build the website.

## Building Lanyon

Go to your project directory and open *\_config.yml*. Delete the following line:

```yaml
relative_permalinks: true
```

...and add this one:

```yaml
gems: [jekyll-paginate]
```

Now you can build and serve your website. Inside the root directory of your website: 

```
$ jekyll build
$ jekyll serve
```

Building it will create a folder, \_site/. It contains the end product, what you'll upload on your server. You can preview the end result by serving it, it'll then be available on **http://localhost:4000/**

## Your content

Jekyll uses Markdown for your content. If you're not familiar with Markdown you can head [over here](http://www.markdowntutorial.com/) for a quick intro.

In the root directory of your website, you'll find a file named *about.md* that creates the About page. You can modify it to suit your needs and add other files, those will create new pages.

Inside the \_posts/ folder, you'll find the articles displayed on the homepage. Those are named following the convention *year-month-day-title.md* and Jekyll parses that info and creates the appropriate html files. For your content, you should follow that convention and put your Markdown files inside the \_posts/ folder.

This was a very quick intro to get you going. Now you can go read [the documentation](http://jekyllrb.com/docs/home/) of Jekyll to get an idea of all the possibilities you have, or just write your .md files and start building your website!

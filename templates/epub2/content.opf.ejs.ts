const content = `
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
         version="2.0"
         unique-identifier="BookId">

    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"
              xmlns:opf="http://www.idpf.org/2007/opf">

        <dc:identifier id="BookId" opf:scheme="URN"><%= id %></dc:identifier>
        <dc:title><%= title %></dc:title>
        <dc:description><%= description %></dc:description>
        <dc:publisher><%= publisher %></dc:publisher>
        <dc:creator opf:role="aut" opf:file-as="<%= author.join(",")  %>"><%= author.join(",") %></dc:creator>
        <dc:date opf:event="modification"><%= date %></dc:date>
        <dc:language><%= lang %></dc:language>
        <% if(cover) { %>
        <meta name="cover" content="image_cover" />
        <% } %>
        <meta name="generator" content="epub-gen" />

    </metadata>

    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
        <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" />
        <item id="css" href="style.css" media-type="text/css" />

        <% if(cover) { %>
        <item id="image_cover" href="cover.<%= cover.extension %>" media-type="<%= cover.mediaType %>" />
        <% } %>
        
        <% images.forEach(function(image, index){ %>
        <item id="image_<%= index %>" href="images/<%= image.id %>.<%= image.extension %>" media-type="<%= image.mediaType %>" />
        <% }) %>
        
        <% content.forEach(function(content, index){ %>
        <item id="content_<%= index %>_<%= content.id %>" href="<%= content.filename %>" media-type="application/xhtml+xml" />
        <% }) %>

        <% fonts.forEach(function(font, index) { %>
        <item id="font_<%= index %>" href="fonts/<%= font.filename %>" media-type="<%= font.mediaType %>" />
        <% }) %>
    </manifest>

    <spine toc="ncx">
        <% content.forEach(function(content, index){ %>
            <% if(content.beforeToc){ %>
                <itemref idref="content_<%= index %>_<%= content.id %>"/>
            <% } %>
        <% }) %>
        <itemref idref="toc" />
        <% content.forEach(function(content, index){ %>
            <% if(!content.beforeToc){ %>
                <itemref idref="content_<%= index %>_<%= content.id %>"/>
            <% } %>
        <% }) %>
    </spine>
    <guide>
        <reference type="toc" title="<%= tocTitle %>" href="toc.xhtml" />
    </guide>
</package>
` as string;

export default content;

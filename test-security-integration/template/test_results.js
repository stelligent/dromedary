Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if(a === b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});
var source = document.getElementById("table-template").innerHTML;
var target = document.getElementById("result-table-wrapper");
var template = Handlebars.compile(source);
var data = JSON.parse('__DATA__');
target.innerHTML = template(data);

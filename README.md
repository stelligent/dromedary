# dromedary :dromedary_camel: <img align="right" src="liatrio.png">
Dromedary is a sample application used by Liatrio to demonstrate CI/CD methods.

## The Demo App :dromedary_camel:

The Dromedary demo app is a simple nodejs application that displays a pie chart to users. The data that
describes the pie chart (i.e. the colors and their values) is served by the application.

If a user clicks on a particular color segment in the chart, the frontend will send a request to the
backend to increment the value for that color and update the chart with the new value.

The frontend will also poll the backend for changes to values of the colors of the pie chart and update the chart
appropriately. If it detects that a new version of the app has been deployed, it will reload the page.

#### Infrastructure as Code

Dromedary was featured by [Paul Duvall](https://twitter.com/PaulDuvall),
[Stelligent](http://www.stelligent.com/)'s Chief Technology Officer, during the
ARC307: Infrastructure as Code breakout session at 2015
[AWS re:Invent](https://reinvent.awsevents.com/).

Click [here](https://www.youtube.com/watch?v=WL2xSMVXy5w) to view a recording of the re:Invent breakout session or, to view a shorter 10-minute walkthrough of the demo, click [here](https://stelligent.com/2015/11/17/stelligent-aws-continuous-delivery-demo-screencast/).

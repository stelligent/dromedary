# dromedary-cookbook

Cookbook for setting up the Dromedary application and any preqrequisites. 

## Supported Platforms

Tested with AWS Linux. Should work on CentOS as well. Ubuntu no promises. 

## Attributes

<table>
  <tr>
    <th>Key</th>
    <th>Type</th>
    <th>Description</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><tt>['dromedary']['S3Bucket']</tt></td>
    <td>String</td>
    <td>The name of the S3 bucket that artifacts are stored in by the scripts and pipeline</td>
    <td><tt>true</tt></td>
  </tr>
  <tr>
    <td><tt>['dromedary']['ArtifactPath']</tt></td>
    <td>String</td>
    <td>The name of the artifact in the S3 bucket to deploy.</td>
    <td><tt>true</tt></td>
  </tr>
</table>

## Usage

### dromedary::default

Include `dromedary` in your node's `run_list`:

```json
{
  "run_list": [
    "recipe[dromedary::default]" 
    "recipe[dromedary::install_dromedary]""

  ]
}
```

`default` will install all prereqs.
`install_dromedary` will install the app.

## Testing

Test Kitchen should work straight away with only minor edits to your .kitchen.yml. You'll need to update the S3Bucket name and the Artifact Path.

Commands:

`kitchen create` to start your Vagrant VM.
`kitchen converge` to run your cookbooks.
`kitchen verify` to run your tests.
`kitchen destroy` to destroy your Vagrant VM.
`kitchen test` to do all those things.
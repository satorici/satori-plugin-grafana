<!-- This README file is going to be the one displayed on the Grafana.com website for your plugin -->

# Satori Data Source

Visualize your Satori-CI reports results in grafana

# Configuration

## Server

The api satori sever where your reports are saved, by default is <https://api.satori-ci.com>

## User Token

Your private token to access to your reports

# Using the editor

The query editor has 2 parameters:

- **Type**: *Monitors* or *Reports*. If you select Reports it will show all available reports in the time rangue. If *Monitors* is selected you will need to select an ID as well.
- **Monitor ID**: only available if the selected type is *Monitors*. Select a Monitor ID to show the reports related to that monitor.

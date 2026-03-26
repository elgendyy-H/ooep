# Performance Testing Guide

## Overview

This document describes how to perform load testing on the OEPP API and scanning engine, and how to optimise database queries and Celery workers.

## Tools

- [k6](https://k6.io/) – open-source load testing tool (recommended)
- [Locust](https://locust.io/) – Python-based load testing (alternative)

## Setup

### Install k6

```bash
# On macOS
brew install k6

# On Linux (Debian/Ubuntu)
sudo apt update
sudo apt install k6
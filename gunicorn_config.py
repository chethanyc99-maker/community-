# Production WSGI Server Configuration for Prerana Assistive Platform
import os
import multiprocessing

bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", 1))
threads = int(os.environ.get("PYTHON_MAX_THREADS", 4))
worker_class = "gthread"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging configuration
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Security and recycling
max_requests = 1000
max_requests_jitter = 50
preload_app = False

from views.User import user_view
from views.Comment import comment_view
from views.Oauth import oauth_view
from views.Post import post_view
from views.System import system_view
from views.Plugin import plugin_view
from views.Luis import luis_view

from views.socket import socket_view
from models import database
from flask_cors import CORS

from views.FakePost import fake_post_view

views = [
    user_view,
    comment_view,
    oauth_view,
    post_view,
    system_view,
    plugin_view,
    luis_view,
    fake_post_view  # Comment this if you do not need fake post functionality
]

plugins = [
    socket_view,
    database,
    CORS()
]


def register_views(app):
    for v in views:
        app.register_blueprint(v)


def register_plugins(app):
    for p in plugins:
        p.init_app(app)


def export_view(view):
    views.append(view)

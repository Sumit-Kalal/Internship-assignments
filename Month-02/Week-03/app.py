from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from routes import main

app = Flask(__name__)

app.config.from_object(Config)

CORS(app)
db.init_app(app)

app.register_blueprint(main)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Database initialized successfully")

    app.run(debug=True)
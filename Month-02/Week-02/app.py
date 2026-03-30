from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from routes import main
import os

app = Flask(
    __name__,
    template_folder=r"C:\Users\sumit\.vscode\codes\Month-02\Week-01\Electrician_management_system",
    static_folder=r"C:\Users\sumit\.vscode\codes\Month-02\Week-01\Electrician_management_system",
    static_url_path=""
)

CORS(app)

app.config.from_object(Config)
app.config["SECRET_KEY"] = "secret123"
db.init_app(app)
app.register_blueprint(main)


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Database initialized successfully")
        
        
    app.run(debug=True)

import os
os.environ['FLASK_APP'] = 'ui_app.py'
os.environ['FLASK_DEBUG'] = 'false'
os.environ['FLASK_HOST'] = '0.0.0.0'
os.environ['FLASK_PORT'] = '5099'

from ui_app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5099, debug=False)

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import paramiko

app = Flask(__name__)
CORS(app)

# Path to your shell script relative to this file
SCRIPT_LOCAL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts', 'cluster_status.sh'))

@app.route('/api/execute-action', methods=['POST'])
def execute_action():
    data = request.json
    action = data.get('selectedAction')
    odr_node = data.get('odrNode')

    # Accept SSH username and password from frontend, or set here for testing
    # ssh_user = data.get('sshUser', 'YOUR_SSH_USERNAME')
    # ssh_password = data.get('sshPassword', 'YOUR_SSH_PASSWORD')

    ssh_user = 'dinesh'
    ssh_password= 'Slavia@9954'

    if action == 'was-cell-status':
        ssh_host = odr_node
        try:
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(hostname=ssh_host, username=ssh_user, password=ssh_password)

            sftp = ssh.open_sftp()
            remote_script_path = '/tmp/cluster_status.sh'
            sftp.put(SCRIPT_LOCAL_PATH, remote_script_path)
            sftp.chmod(remote_script_path, 0o755)
            sftp.close()

            stdin, stdout, stderr = ssh.exec_command(f'bash {remote_script_path}')
            output = stdout.read().decode('utf-8')
            error_output = stderr.read().decode('utf-8')
            ssh.close()

            if error_output:
                result = f"Error:\n{error_output}\nOutput:\n{output}"
            else:
                result = output

            return jsonify({'result': result})

        except Exception as e:
            return jsonify({'result': f'Exception: {str(e)}'}), 500

    return jsonify({'result': 'Action not implemented'}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)

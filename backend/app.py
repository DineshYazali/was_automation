import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import paramiko

app = Flask(__name__)
CORS(app)

def copy_script_to_remote(ssh_host, ssh_user, ssh_password, script_name):
    """
    Handles SSH connection and uploads the script only (no execution).
    """
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=ssh_host, username=ssh_user, password=ssh_password)

        sftp = ssh.open_sftp()
        remote_script_path = f'/tmp/{script_name}'
        script_local_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', 'scripts', script_name)
        )
        sftp.put(script_local_path, remote_script_path)
        sftp.chmod(remote_script_path, 0o755)
        sftp.close()
        ssh.close()
        return None
    except Exception as e:
        return str(e)

def execute_remote_script(ssh_host, ssh_user, ssh_password, script_name, script_args=None):
    """
    Handles SSH connection, uploads the script, executes it with arguments, and returns output/error.
    """
    script_args = script_args or []
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=ssh_host, username=ssh_user, password=ssh_password)

        sftp = ssh.open_sftp()
        remote_script_path = f'/tmp/{script_name}'
        script_local_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', 'scripts', script_name)
        )
        sftp.put(script_local_path, remote_script_path)
        sftp.chmod(remote_script_path, 0o755)
        sftp.close()

        command = f"bash {remote_script_path} {' '.join(script_args)}"
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode('utf-8')
        error_output = stderr.read().decode('utf-8')
        ssh.close()

        if error_output:
            result = f"Error:\n{error_output}\nOutput:\n{output}"
        else:
            result = output

        return result, None
    except Exception as e:
        return None, str(e)

@app.route('/api/execute-action', methods=['POST'])
def execute_action():
    data = request.json
    action = data.get('selectedAction')
    odr_node = data.get('odrNode')
    ssh_user = 'dinesh'
    ssh_password = 'Slavia@9954'

    # Map actions to script names
    action_script_map = {
        'was-cell-status': 'cluster_status.sh',
        'jdbc-test': 'jdbctest.sh',
        'cycle-jvm': 'cycle_jvms.sh'
    }

    if action == 'cycle-jvm':
        # Copy all required scripts, but only execute cycle_jvms.sh
        scripts_to_copy = ['cycle_jvms.sh', 'status.sh', 'task.sh']
        for script in scripts_to_copy:
            copy_error = copy_script_to_remote(
                ssh_host=odr_node,
                ssh_user=ssh_user,
                ssh_password=ssh_password,
                script_name=script
            )
            if copy_error:
                return jsonify({'result': f'Exception copying {script}: {copy_error}'}), 500
        # Now execute only cycle_jvms.sh with args
        args = [data.get('domain', '')]
        result, error = execute_remote_script(
            ssh_host=odr_node,
            ssh_user=ssh_user,
            ssh_password=ssh_password,
            script_name='cycle_jvms.sh',
            script_args=args
        )
        if error:
            return jsonify({'result': f'Exception: {error}'}), 500
        return jsonify({'result': result})

    script_name = action_script_map.get(action)
    if script_name:
        args = [data.get('domain', '')]
        result, error = execute_remote_script(
            ssh_host=odr_node,
            ssh_user=ssh_user,
            ssh_password=ssh_password,
            script_name=script_name,
            script_args=args
        )
        if error:
            return jsonify({'result': f'Exception: {error}'}), 500
        return jsonify({'result': result})

    return jsonify({'result': 'Action not implemented'}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)
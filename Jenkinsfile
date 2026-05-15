pipeline {
    agent any
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        // Konfigurasi Image & Kredensial
        DOCKER_IMAGE = "lombokhalalroom/lombok-halal-room-web-app-jenkins"
        REGISTRY_CRED = "dockerhub-credentials" 
        SSH_CRED = "vps-ssh-key"               
        VPS_HOST = "38.147.122.123"
        VPS_USER = "production"
        TARGET_DIR = "/opt/lhr-jenkins"
    }

    stages {
        stage('Preparation') {
            steps {
                // Ekivalen dengan actions/checkout@v4
                checkout scm
                script {
                    // Membuat tag unik Short SHA (7 karakter)
                    env.GIT_SHA = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    // Ekivalen dengan docker/login-action & build-push-action
                    // Tahap ini berjalan untuk semua branch dan Pull Request sebagai verifikasi
                    docker.withRegistry('https://index.docker.io/v1/', "${REGISTRY_CRED}") {
                        def customImage = docker.build("${DOCKER_IMAGE}:${env.GIT_SHA}")
                        
                        // Push tag SHA dan tag latest
                        customImage.push()
                        customImage.push("latest")
                    }
                }
            }
        }

        stage('Deploy to VPS') {
            // Logika "if: github.event_name == 'push'" dan branch "production"
            // Tahap ini akan otomatis di-SKIP jika bukan branch production (misal saat masih Pull Request)
            when {
                branch 'production'
            }
            steps {
                sshagent(["${SSH_CRED}"]) {
                    sh """
                        # Ekivalen dengan appleboy/scp-action
                        scp -o StrictHostKeyChecking=no docker-compose.yml ${VPS_USER}@${VPS_HOST}:${TARGET_DIR}

                        # Ekivalen dengan appleboy/ssh-action (SSH Deploy & Atomic Update)
                        ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'EOF'
                            set -e
                            start=\$(date +%s)
                            cd ${TARGET_DIR}

                            # Mengganti tag image secara dinamis
                            sed -i "s|image: ${DOCKER_IMAGE}:.*|image: ${DOCKER_IMAGE}:${env.GIT_SHA}|g" docker-compose.yml

                            echo "--- Updating Container to Version: ${env.GIT_SHA} ---"
                            docker compose pull
                            docker compose up -d --remove-orphans

                            echo "--- Health Checking (Port 3001) ---"
                            until curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q 200; do
                              printf "."
                              sleep 1
                            done

                            end=\$(date +%s)
                            echo -e "\n===================================================="
                            echo "DEPLOYMENT SUCCESS!"
                            echo "Deployment Time: \$((end - start)) seconds"
                            echo "===================================================="
                            docker image prune -f
EOF
                    """
                }
            }
        }
    }

    post {
        always {
            // Membersihkan ruang kerja setelah selesai
            cleanWs()
        }
    }
}
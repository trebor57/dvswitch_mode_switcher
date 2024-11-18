Create the self-signed SSL certificate in this folder or install the certificates you want to use here.

Here is the process to create a self-signed certificate:

openssl genrsa -out client-key.pem 2048
openssl req -new -key client-key.pem -out client.csr
openssl x509 -req -in client.csr -signkey client-key.pem -out client-cert.pem

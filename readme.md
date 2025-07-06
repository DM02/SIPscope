<h1 align="center">Welcome to SIPscope 👋</h1>
<p>
</p>

> SIP-RTP Packet Editor

A web application for analyzing, filtering, and editing VoIP traffic captured in .pcap files. The tool allows you to:

Load and parse packet capture files containing SIP and RTP protocols.

Inspect sessions in a user-friendly interface.

Edit packet contents and modify relevant fields.

Export the modified packet capture as a new .pcap file.

Backend: FastAPI (Python)
Frontend: React (JavaScript)

### 🏠 [Homepage](github.com/DM02/PcapForge)

## Virtual environment(backend)

```sh
python -m venv venv
```
```sh
.\venv\Scripts\activate
```
## Install dependencies (backend)

```sh
pip install -r .\requirements.txt
```
```sh
uvicorn main:app --reload
```
## Install and run frontend

```sh
yarn
```
```sh
yarn start
```



## Author

👤 **DM02**


## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](github.com/DM02/PcaPForge/issues). 

## Show your support

Give a ⭐️ if this project helped you!

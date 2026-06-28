import os

os.environ.pop('HTTP_PROXY', None); os.environ.pop('HTTPS_PROXY', None)

import requests.packages.urllib3.util.connection as urllib3_cn

urllib3_cn.HAS_IPV6 = False


import requests


# 后续正常发起请求
headers = {
    'Authorization': 'Bearer {api_key}',
    'Content-Type': 'application/json',
}

json_data = {
    'inputs': {},
    'query': 'What are the specs of the iPhone 13 Pro Max?',
    'response_mode': 'streaming',
    'conversation_id': '',
    'user': 'abc-123',
    'files': [
        {
            'type': 'image',
            'transfer_method': 'remote_url',
            'url': 'https://cloud.dify.ai/logo/logo-site.png',
        },
    ],
}

try:
    response = requests.post(
        'https://kunan-ai.chinalco.com.cn:8200/v1/chat-messages',
        headers=headers,
        json=json_data,
        timeout=10
    )
    print(response.text)
except Exception as e:
    print("请求失败:", e)
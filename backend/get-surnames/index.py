'''
Business: Получает фамилии из базы данных с фильтрацией по дате
Args: event - dict с httpMethod, queryStringParameters (date optional)
      context - object с request_id
Returns: HTTP response со списком фамилий
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    params = event.get('queryStringParameters') or {}
    date_filter = params.get('date')
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    if date_filter:
        cursor.execute(
            "SELECT id, surname, date, color, counter, linked_id FROM surnames WHERE date = %s ORDER BY id",
            (date_filter,)
        )
    else:
        cursor.execute(
            "SELECT id, surname, date, color, counter, linked_id FROM surnames ORDER BY date, id LIMIT 1000"
        )
    
    rows = cursor.fetchall()
    
    surnames: List[Dict[str, Any]] = []
    for row in rows:
        surnames.append({
            'id': row[0],
            'surname': row[1],
            'date': row[2].strftime('%Y-%m-%d') if row[2] else None,
            'color': row[3],
            'counter': row[4],
            'linkedId': row[5]
        })
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'surnames': surnames,
            'total': len(surnames)
        })
    }

"""Refresh actual public data. Standard-library Python; failures remain explicit."""
import urllib.request,json,datetime,concurrent.futures,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
COMPANIES=[('RELIANCE','Reliance Industries','Energy'),('TCS','Tata Consultancy Services','IT services'),('INFY','Infosys','IT services'),('HDFCBANK','HDFC Bank','Banking'),('ICICIBANK','ICICI Bank','Banking'),('ITC','ITC','Consumer'),('HINDUNILVR','Hindustan Unilever','Consumer'),('LT','Larsen & Toubro','Industrials'),('BHARTIARTL','Bharti Airtel','Telecom'),('SUNPHARMA','Sun Pharma','Healthcare'),('TITAN','Titan Company','Consumer'),('MARUTI','Maruti Suzuki','Auto'),('TATASTEEL','Tata Steel','Materials'),('NTPC','NTPC','Utilities'),('PERSISTENT','Persistent Systems','IT services'),('DIXON','Dixon Technologies','Electronics'),('CAMS','CAMS','Financial services'),('CARYSIL','Carysil','Consumer durables')]
def get(u):
 with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as r:return json.load(r)
def quote(c):
 s,name,sector=c;u=f'https://query1.finance.yahoo.com/v8/finance/chart/{s}.NS?range=3mo&interval=1d';out=dict(symbol=s,name=name,sector=sector,source=u)
 try:
  d=get(u)['chart']['result'][0];q=d['indicators']['quote'][0];now=datetime.datetime.now(datetime.timezone.utc)
  bars=[dict(date=datetime.datetime.fromtimestamp(t,datetime.timezone.utc).date().isoformat(),close=p,volume=v) for t,p,v in zip(d['timestamp'],q['close'],q['volume']) if p is not None and v is not None and (datetime.datetime.fromtimestamp(t,datetime.timezone.utc).date()<now.date() or now.hour>=10)]
  out.update(bars=bars,status='ok')
 except Exception as e:out.update(bars=[],status='unavailable',error=str(e))
 return out
if __name__=='__main__':
 now=datetime.datetime.now(datetime.timezone.utc)
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:stocks=list(ex.map(quote,COMPANIES))
 u=f'https://www.nseindia.com/api/corporate-announcements?index=equities&from_date={(now-datetime.timedelta(days=30)):%d-%m-%Y}&to_date={now:%d-%m-%Y}'
 try:rows=[r for r in get(u) if r.get('symbol') in {c[0] for c in COMPANIES}];error=None
 except Exception as e:rows=[];error=str(e)
 data=dict(fetchedAt=now.isoformat(),portfolio=stocks,announcements=rows,filingSource=u,filingError=error)
 (ROOT/'lib/data/snapshot.json').write_text(json.dumps(data,indent=2));print('Prices',sum(s['status']=='ok' for s in stocks),'of',len(stocks),'filings',len(rows),error,flush=True)

# -*- coding: utf-8 -*-
import UnityPy, os
ROOT = r'C:\Users\CHEN\Desktop\repo\data\raw\R.E.P.O.v0.4.0\REPO\REPO_Data'
OUT = r'C:\Users\CHEN\Desktop\repo\content\renders'
os.makedirs(OUT, exist_ok=True)
ENV = UnityPy.load(os.path.join(ROOT,'resources.assets'))
def rd(o):
    try: return o.read()
    except Exception: return None
want = {
 'drone_icon_battery charge':'ITEM.DRONE_BATTERY',
 'drone_icon_feather':'ITEM.DRONE_FEATHER',
 'drone_icon_indestructible':'ITEM.DRONE_INDESTRUCTIBLE',
 'drone_icon_torque':'ITEM.DRONE_TORQUE',
 'drone_icon_zero gravity':'ITEM.DRONE_ZERO_GRAVITY',
 'drone_icon_heal':'ITEM.DRONE_RECHARGE_HEAL_unmapped',
 'drone_icon_magnet':'ITEM.DRONE_MAGNET_unmapped',
}
found={}
for o in ENV.objects:
    if o.type.name!='Texture2D': continue
    d=rd(o)
    if d is None: continue
    nm=str(d.m_Name)
    if nm in want:
        p=os.path.join(OUT, want[nm]+'.png')
        try:
            d.image.save(p)
            found[nm]=(p, os.path.getsize(p), d.m_Width, d.m_Height)
        except Exception as e:
            print('save fail', nm, e)
for k,v in sorted(found.items()):
    print('EXPORTED|%s|%s|%dx%d|%d bytes'%(k, os.path.basename(v[0]), v[2], v[3], v[1]))
print('total exported', len(found))

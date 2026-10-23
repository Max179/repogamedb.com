# -*- coding: utf-8 -*-
"""Assemble full enemy models: group renderers by material-texture match under a common root."""
import UnityPy, os, json
ROOT = r'C:\Users\CHEN\Desktop\repo\data\raw\R.E.P.O.v0.4.0\REPO\REPO_Data'
WORK = r'C:\Users\CHEN\AppData\Local\Temp\repo_renders\work'
os.makedirs(WORK, exist_ok=True)
KEYWORDS = {'ENEMY.OOGLY':['oogly'], 'ENEMY.BOMB_THROWER':['bomb thrower'], 'ENEMY.HEAD':['headman']}
ENV = UnityPy.load(os.path.join(ROOT,'resources.assets'))
BY_ID={o.path_id:o for o in ENV.objects}
print('objects',len(BY_ID),flush=True)
def rd(o):
    try: return o.read()
    except Exception: return None
def gv(o,*n):
    for x in n:
        if hasattr(o,x): return getattr(o,x)
    return None
def qm(q):
    x=gv(q,'x');y=gv(q,'y');z=gv(q,'z');w=gv(q,'w')
    return [[1-2*(y*y+z*z),2*(x*y-w*z),2*(x*z+w*y)],[2*(x*y+w*z),1-2*(x*x+z*z),2*(y*z-w*x)],[2*(x*z-w*y),2*(y*z+w*x),1-2*(x*x+y*y)]]
def cmat(t,q,s):
    m=qm(q)
    return [[m[0][0]*s[0],m[0][1]*s[1],m[0][2]*s[2],t[0]],[m[1][0]*s[0],m[1][1]*s[1],m[1][2]*s[2],t[1]],[m[2][0]*s[0],m[2][1]*s[1],m[2][2]*s[2],t[2]],[0,0,0,1]]
def mm(a,b): return [[sum(a[i][k]*b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
def xf(m,v):
    x,y,z=v
    return [m[0][0]*x+m[0][1]*y+m[0][2]*z+m[0][3],m[1][0]*x+m[1][1]*y+m[1][2]*z+m[1][3],m[2][0]*x+m[2][1]*y+m[2][2]*z+m[2][3]]
I4=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]

# ---- build go -> (transform, parent go, world matrix cache) ----
TR={}   # goid -> transform obj
GO_PARENT={}
GO_NAME={}
world_cache={}
for o in ENV.objects:
    if o.type.name!='GameObject': continue
    d=rd(o)
    if d is None: continue
    GO_NAME[o.path_id]=str(d.m_Name)
    for c in d.m_Component:
        p=gv(c,'component'); co=BY_ID.get(gv(p,'m_PathID'))
        if co is not None and co.type.name in ('Transform','RectTransform'):
            TR[o.path_id]=co
print('TR built',len(TR),flush=True)

def parent_go(goid):
    t=TR.get(goid)
    if t is None: return None
    d=rd(t)
    if d is None: return None
    f=gv(d,'m_Father')
    if f is None or gv(f,'m_PathID') in (0,None): return None
    fo=BY_ID.get(gv(f,'m_PathID'))
    if fo is None: return None
    fd=rd(fo)
    if fd is None: return None
    gp=gv(fd,'m_GameObject')
    if gp is None: return None
    return gv(gp,'m_PathID')

def world_of(goid):
    if goid in world_cache: return world_cache[goid]
    chain=[]; cur=goid; guard=0
    while cur is not None and guard<128:
        guard+=1
        t=TR.get(cur)
        if t is None: break
        d=rd(t)
        if d is None: break
        chain.append(d)
        cur=parent_go(cur)
    m=I4
    for d in reversed(chain):
        lp=d.m_LocalPosition;lq=d.m_LocalRotation;ls=d.m_LocalScale
        m=mm(m,cmat((gv(lp,'x'),gv(lp,'y'),gv(lp,'z')),lq,(gv(ls,'x'),gv(ls,'y'),gv(ls,'z'))))
    world_cache[goid]=m
    return m

def root_of(goid):
    cur=goid; last=goid; guard=0
    while cur is not None and guard<128:
        guard+=1
        last=cur
        cur=parent_go(cur)
    return last

def mesh_of_go(goid):
    """return (mesh, renderer_type) using MeshFilter or SkinnedMeshRenderer"""
    t=TR.get(goid)
    if t is None: return None,None
    d=rd(t)
    if d is None: return None,None
    for c in d.m_GameObject if False else []:
        pass
    go=BY_ID.get(goid)
    gd=rd(go)
    if gd is None: return None,None
    skinned=None; filter_mesh=None
    for c in gd.m_Component:
        p=gv(c,'component'); co=BY_ID.get(gv(p,'m_PathID'))
        if co is None: continue
        cd=rd(co)
        if cd is None: continue
        if co.type.name=='SkinnedMeshRenderer':
            skinned=cd
        elif co.type.name=='MeshFilter':
            filter_mesh=cd
    if skinned is not None and gv(skinned,'m_Mesh') is not None:
        try: return skinned.m_Mesh.read(),'SkinnedMeshRenderer'
        except Exception: pass
    if filter_mesh is not None and gv(filter_mesh,'m_Mesh') is not None:
        try: return filter_mesh.m_Mesh.read(),'MeshFilter'
        except Exception: pass
    return None,None

def parse_obj(t):
    v=[];vt=[];f=[]
    for line in t.splitlines():
        if line.startswith('v '):
            p=line.split(); v.append((float(p[1]),float(p[2]),float(p[3])))
        elif line.startswith('vt '):
            p=line.split(); vt.append((float(p[1]),float(p[2])))
        elif line.startswith('f '):
            idx=[]
            for tok in line.split()[1:]:
                q=tok.split('/'); idx.append((int(q[0]), int(q[1]) if len(q)>1 and q[1] else 0))
            f.append(idx)
    return v,vt,f

# ---- collect renderers per texture keyword ----
records={}
for o in ENV.objects:
    if o.type.name not in ('MeshRenderer','SkinnedMeshRenderer'): continue
    d=rd(o)
    if d is None: continue
    mats=gv(d,'m_Materials')
    if not mats: continue
    texs=[]
    for mp in mats:
        try: md=mp.read()
        except Exception: continue
        try:
            for pair in md.m_SavedProperties.m_TexEnvs:
                tp=gv(pair[1],'m_Texture')
                if tp is not None and gv(tp,'m_PathID') not in (0,None):
                    tx=rd(tp)
                    if tx is not None: texs.append(str(tx.m_Name))
        except Exception: pass
    if not texs: continue
    gp=gv(d,'m_GameObject')
    if gp is None: continue
    goid=gv(gp,'m_PathID')
    records.setdefault(o.path_id,(goid, sorted(set(texs))))
print('renderers indexed',len(records),flush=True)

result={}
for key,kws in KEYWORDS.items():
    sel=[]
    for pid,(goid,texs) in records.items():
        low=[t.lower() for t in texs]
        if any(any(k in t for k in kws) for t in low):
            sel.append((goid,texs))
    groups={}
    for goid,texs in sel:
        r=root_of(goid)
        groups.setdefault(r,[]).append((goid,texs))
    ranked=sorted(groups.items(), key=lambda kv:-len(kv[1]))[:6]
    print('=== %s : 命中 %d 个渲染器, %d 个根组 ==='%(key,len(sel),len(groups)),flush=True)
    for r,items in ranked:
        print('   根 %s(%s) -> %d 个渲染器'%(r, GO_NAME.get(r,'?'), len(items)),flush=True)
    # choose best group: most renderers, but not absurdly large
    best=None
    for r,items in ranked:
        if len(items)>=2:
            best=(r,items); break
    if best is None and ranked: best=ranked[0]
    if best is None:
        print('   NO GROUP',flush=True); continue
    r,items=best
    parts=[]; total=0; texcount={}
    for goid,texs in items:
        mesh,rtype=mesh_of_go(goid)
        if mesh is None: continue
        try: text=mesh.export()
        except Exception: continue
        if not text: continue
        v,vt,f=parse_obj(text)
        if not v: continue
        w=world_of(goid)
        use=I4 if rtype=='SkinnedMeshRenderer' else w
        wv=[xf(use,p) for p in v]
        xs=[p[0] for p in wv]; ys=[p[1] for p in wv]; zs=[p[2] for p in wv]
        ext=max(max(xs)-min(xs),max(ys)-min(ys),max(zs)-min(zs))
        if ext>6.0: continue
        parts.append((GO_NAME.get(goid,'?'),str(mesh.m_Name),wv,vt,f,ext))
        total+=len(wv)
        for t in texs: texcount[t]=texcount.get(t,0)+1
    obj=os.path.join(WORK,key+'.obj'); vb=1; tb=1; allv=[]
    with open(obj,'w',encoding='utf-8') as fh:
        fh.write('# %s root=%s\n'%(key,GO_NAME.get(r,'?')))
        for (gn,mn,wv,vt,f,ext) in parts:
            for p in wv: fh.write('v %.6f %.6f %.6f\n'%tuple(p)); allv.append(p)
            for p in vt: fh.write('vt %.6f %.6f\n'%p)
            for face in f:
                toks=[]
                for (vi,ti) in face:
                    a=vb+(vi-1 if vi>0 else len(wv)+vi); b=(tb+(ti-1)) if ti>0 else 0
                    toks.append(('%d/%d'%(a,b)) if b else ('%d'%a))
                fh.write('f '+' '.join(toks)+'\n')
            vb+=len(wv); tb+=len(vt)
    bbox=None
    if allv:
        xs=[p[0] for p in allv]; ys=[p[1] for p in allv]; zs=[p[2] for p in allv]
        bbox=(round(min(xs),2),round(max(xs),2),round(min(ys),2),round(max(ys),2),round(min(zs),2),round(max(zs),2))
    result[key]=dict(root=GO_NAME.get(r,'?'),root_id=r,parts=len(parts),verts=len(allv),bbox=bbox,obj=obj,
                     tex=sorted(texcount.items(),key=lambda x:-x[1])[:6])
    print('   -> 导出 parts=%d verts=%d bbox=%s'%(len(parts),len(allv),bbox),flush=True)
    print('   -> 贴图统计:',sorted(texcount.items(),key=lambda x:-x[1])[:5],flush=True)
json.dump(result,open(os.path.join(WORK,'summary3.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('DONE')

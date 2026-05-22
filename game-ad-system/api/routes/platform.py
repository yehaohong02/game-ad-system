import os
import glob
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

router = APIRouter(prefix="/api/platform", tags=["platform"])

DATA_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "数据")


@router.get("/files")
def list_crawled_files(crawl_dir: str):
    """List all Excel files in the crawl directory (including subdirectories)."""
    if not os.path.isdir(crawl_dir):
        raise HTTPException(404, f"Directory not found: {crawl_dir}")

    files = []
    for root, _dirs, filenames in os.walk(crawl_dir):
        rel_dir = os.path.relpath(root, crawl_dir)
        for f in filenames:
            if f.endswith(('.xlsx', '.xls', '.csv')):
                files.append({
                    "name": f,
                    "path": os.path.join(root, f),
                    "size": os.path.getsize(os.path.join(root, f)),
                    "dir": rel_dir if rel_dir != '.' else '',
                })
    return files


@router.get("/file")
def read_local_file(path: str):
    """Read a local file and return its raw bytes."""
    if not os.path.isfile(path):
        raise HTTPException(404, f"File not found: {path}")
    # Security: only allow reading from 数据 directory
    real_path = os.path.realpath(path)
    data_root = os.path.realpath(DATA_ROOT)
    if not real_path.startswith(data_root):
        raise HTTPException(403, "Access denied: can only read from 数据 directory")
    with open(path, 'rb') as f:
        return Response(content=f.read(), media_type="application/octet-stream")

import { StreamService } from './stream.service';
import { Observable } from 'rxjs';
import { spawn, exec } from 'child_process';
import { IListDirParams } from '@core/interfaces';
import { FileService } from './files.service';

export abstract class UnixFilesService extends FileService {
  constructor(protected streamService: StreamService) {
    super();
  }

  abstract getFolderSize(path: string): Observable<any>;

  listDir(params: IListDirParams): Observable<Buffer> {
    const args = this.prepareFindArgs(params);

    const child = spawn('find', args);

    return this.streamService.getStream(child);
  }

  deleteDir(path: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      const command = `rm -rf "${path}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) return reject(error);
        if (stderr) return reject(stderr);
        resolve(stdout);
      });
    });
  }

  protected prepareFindArgs(params: IListDirParams): string[] {
    const { path, target, exclude, excludeHiddenDirectories } = params;
    let args: string[] = [path];

    if (exclude) {
      args = [...args, this.prepareExcludeArgs(exclude)].flat();
    }

    if (excludeHiddenDirectories) {
      args = [...args, '-not', '-path', '*/.*'];
    }

    args = [...args, '-name', target, '-type', 'd', '-prune'];

    return args;
  }

  protected prepareExcludeArgs(exclude: string[]): string[] {
    const excludeDirs = exclude.map((dir: string) => [
      '-not',
      '(',
      '-name',
      dir,
      '-prune',
      ')',
    ]);
    return excludeDirs.flat();
  }
}
